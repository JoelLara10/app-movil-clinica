"""Independent mobile checks: a failed/unavailable scanner never becomes a pass."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
REASONS = {
    'Dato sintetico de prueba; nunca usar en produccion',
    'Texto de interfaz o nombre de clave; no es credencial',
    'Identificador publico o checksum; no es credencial',
}


def validate_reviewed(items):
    if not isinstance(items, list):
        raise ValueError('Invalid fixture catalog')
    for item in items:
        if not isinstance(item, dict) or set(item) != {'file', 'type', 'hashed_secret', 'reason'}:
            raise ValueError('Invalid fixture fields')
        filename = item['file']
        if (not isinstance(filename, str) or not filename or '\\' in filename
                or filename.startswith('/') or '..' in filename.split('/')
                or not (ROOT / filename).resolve().is_relative_to(ROOT.resolve())
                or not (ROOT / filename).is_file()):
            raise ValueError('Fixture must identify one repository file')
        if (not isinstance(item['hashed_secret'], str)
                or not re.fullmatch(r'[a-f0-9]{40}', item['hashed_secret'])
                or item['reason'] not in REASONS
                or item['type'] not in {'Secret Keyword', 'Hex High Entropy String',
                                        'Base64 High Entropy String', 'Basic Auth Credentials', 'JSON Web Token'}):
            raise ValueError('Fixture requires a reviewed type, digest and reason')


def finding_locations(scan, reviewed):
    if not isinstance(scan, dict) or not isinstance(scan.get('results'), dict):
        raise ValueError('Incomplete secret scan')
    allowed = {(i['file'], i['type'], i['hashed_secret']) for i in reviewed}
    locations = []
    for filename, hits in scan['results'].items():
        name = filename.replace('\\', '/')
        for hit in hits:
            if (name, hit['type'], hit['hashed_secret']) not in allowed:
                locations.append({'file': name, 'type': hit['type'], 'line': hit['line_number']})
    return locations


def audit_status(report):
    if not isinstance(report, dict) or 'error' in report:
        raise ValueError('Dependency scanner error')
    counts = report['metadata']['vulnerabilities']
    if not all(isinstance(counts.get(k), int) and counts[k] >= 0 for k in ['high', 'critical']):
        raise ValueError('Incomplete dependency scan')
    return (1 if counts['high'] or counts['critical'] else 0,
            f"high={counts['high']}, critical={counts['critical']}")


def run_check(name, command, out, mode='text', runner=subprocess.run):
    start = time.monotonic()
    try:
        proc = runner(command, cwd=ROOT, capture_output=True, text=True,
                      encoding='utf-8', errors='replace', timeout=600,
                      env={**os.environ, 'PYTHONUTF8': '1'})
        rc, stdout = proc.returncode, proc.stdout
        detail = f'Exit code {rc}'
        if mode == 'audit':
            # npm uses code 1 for vulnerabilities; code >1 signals a tool failure.
            report = json.loads(stdout)
            status, detail = audit_status(report)
            if rc not in (0, 1):
                raise ValueError('Dependency scanner unavailable')
            rc = max(rc, status)
            stdout = json.dumps(report, ensure_ascii=False, indent=2)
        elif mode == 'secrets':
            if rc != 0:
                raise ValueError('Secret scanner unavailable')
            scan = json.loads(stdout)
            reviewed = json.loads((ROOT / 'ci/security-reviewed-fixtures.json').read_text(encoding='utf-8'))
            validate_reviewed(reviewed)
            hits = finding_locations(scan, reviewed)
            rc = 1 if hits else 0
            detail = f'{len(hits)} unreviewed suspected secrets'
            # Never retain scanner raw values or source excerpts in reports.
            stdout = json.dumps({'unreviewed_findings': hits, 'reviewed_fixtures': len(reviewed)}, indent=2)
        (out / (name + ('.json' if mode != 'text' else '.log'))).write_text(stdout, encoding='utf-8')
        # Scanner stderr is intentionally not archived: it may contain source values.
    except (OSError, subprocess.TimeoutExpired, ValueError, KeyError, TypeError) as exc:
        rc, detail = 2, 'Check unavailable or invalid report: ' + type(exc).__name__
        (out / (name + '-error.log')).write_text(detail, encoding='utf-8')
    result = {'name': name, 'passed': rc == 0, 'exit_code': rc,
              'seconds': round(time.monotonic() - start, 3), 'detail': detail}
    print(f"{name}: {'PASS' if result['passed'] else 'FAIL'} — {detail}", flush=True)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', required=True)
    args = parser.parse_args()
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    npm = shutil.which('npm.cmd' if os.name == 'nt' else 'npm') or 'npm'
    source = {'sha': sha, 'tracked_changes': bool(subprocess.check_output(
        ['git', 'status', '--porcelain', '--untracked-files=no'], cwd=ROOT, text=True).strip()),
        'time_utc': dt.datetime.now(dt.timezone.utc).isoformat()}
    (out / 'source.json').write_text(json.dumps(source, indent=2), encoding='utf-8')
    results = [
        run_check('dependencies', [npm, 'audit', '--json', '--audit-level=high'], out, 'audit'),
        run_check('secrets', [sys.executable, '-m', 'detect_secrets', 'scan', '--no-verify',
                  '--exclude-files', r'^ci[/\\]security-reviewed-fixtures\.json$'], out, 'secrets'),
        run_check('static-code', [npm, 'run', 'lint'], out),
        run_check('mobile-tests', [npm, 'test'], out),
        run_check('gate-policy', [sys.executable, '-m', 'unittest', 'discover',
                  '-s', 'ci', '-p', 'test_security_gate.py'], out),
    ]
    passed = all(x['passed'] for x in results)
    (out / 'summary.json').write_text(json.dumps({**source, 'checks': results, 'passed': passed}, indent=2), encoding='utf-8')
    suite = ET.Element('testsuite', name='OftalCore.Mobile.Security', tests=str(len(results)),
                       failures=str(sum(not r['passed'] for r in results)))
    for result in results:
        case = ET.SubElement(suite, 'testcase', classname='OftalCore.Mobile.Security',
                             name=result['name'], time=str(result['seconds']))
        if not result['passed']:
            ET.SubElement(case, 'failure', message=result['detail']).text = 'Review the safe archived report.'
    ET.ElementTree(suite).write(out / 'security-gates.xml', encoding='utf-8', xml_declaration=True)
    (out / 'summary.md').write_text('# Mobile code and security review\n\nSHA: ' + sha + '\n\n' +
        '\n'.join(f"- {r['name']}: {'PASS' if r['passed'] else 'FAIL'} — {r['detail']}" for r in results) +
        '\n\nCodeQL runs separately. Automated checks do not replace device testing or human review.\n', encoding='utf-8')
    return 0 if passed else 1


if __name__ == '__main__':
    raise SystemExit(main())
