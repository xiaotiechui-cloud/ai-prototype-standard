"""Optional evidence preflight; hashes profile snapshot bytes and validates declared readback only."""
import argparse
import codecs
import hashlib
import json
from pathlib import Path


def resolve(root, relative):
    if type(relative) is not str or not relative.strip():
        raise ValueError('path must be a nonempty relative path')
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError(f'path escapes declared root: {relative}')
    if not path.is_file():
        raise ValueError(f'path does not exist: {relative}')
    return path


def sha256(path, length=64):
    return hashlib.sha256(path.read_bytes()).hexdigest()[:length]


def validate(data, root):
    errors = []
    if type(data) is not dict or data.get('protocol') != 'execution-evidence-1':
        return ['protocol must be execution-evidence-1']

    profile = data.get('profile')
    if type(profile) is not dict:
        errors.append('profile must be an object')
    else:
        truncation = profile.get('truncation_length')
        if type(truncation) is not int or not 1 <= truncation <= 64:
            errors.append('profile truncation_length must be an integer from 1 to 64')
            truncation = 64
        if type(profile.get('sha256')) is not str or len(profile['sha256']) != truncation:
            errors.append('profile sha256 length must match truncation_length')
        try:
            profile_path = resolve(root, profile.get('path'))
            if profile.get('sha256') != sha256(profile_path, truncation):
                errors.append('profile sha256 does not match original bytes')
        except (ValueError, OSError) as exc:
            errors.append(f'profile: {exc}')
        if profile.get('algorithm') != 'sha256':
            errors.append('profile algorithm must be declared as sha256')
        if not profile.get('serialization') or not profile.get('normalization'):
            errors.append('profile serialization and normalization must be declared')
        if type(profile.get('consumed_fields')) is not list or not profile['consumed_fields']:
            errors.append('profile consumed_fields must identify fields used before generation')
        if profile.get('consumption_stage') != 'before-generation':
            errors.append('profile consumption_stage must be before-generation')

    artifact = data.get('artifact')
    if type(artifact) is not dict:
        errors.append('artifact must be an object separate from profile')
    else:
        try:
            artifact_path = resolve(root, artifact.get('path'))
            if artifact.get('sha256') != sha256(artifact_path):
                errors.append('artifact sha256 does not match original bytes')
        except (ValueError, OSError) as exc:
            errors.append(f'artifact: {exc}')

    run = data.get('run')
    if type(run) is not dict:
        errors.append('run must be an object')
    else:
        for key in ('entrypoint', 'working_directory', 'evidence_path', 'environment'):
            if not run.get(key):
                errors.append(f'run.{key} is required')
        if run.get('entrypoint'):
            try:
                resolve(root, run['entrypoint'])
            except (ValueError, OSError) as exc:
                errors.append(f'run.entrypoint: {exc}')
        if type(run.get('working_directory')) is str and run['working_directory']:
            workdir = (root / run['working_directory']).resolve()
            if not workdir.is_relative_to(root.resolve()) or not workdir.is_dir():
                errors.append('run.working_directory must exist inside declared root')
        elif run.get('working_directory'):
            errors.append('run.working_directory must be a relative path string')
        if type(run.get('dependencies')) is not list:
            errors.append('run.dependencies must be a declared list')
        try:
            codecs.lookup(run.get('results_encoding', ''))
        except (LookupError, TypeError):
            errors.append('run.results_encoding must name a supported encoding')

    writes = data.get('write_readback')
    if type(writes) is not list or not writes:
        errors.append('write_readback must contain at least one operation')
    else:
        for i, row in enumerate(writes):
            if type(row) is not dict:
                errors.append(f'write_readback[{i}] must be an object')
                continue
            for key in ('action', 'target_id', 'published_value', 'consumer_value', 'consumer', 'evidence_path', 'evidence_sha256'):
                if key not in row or row[key] is None or row[key] == '':
                    errors.append(f'write_readback[{i}].{key} is required')
            if 'published_value' in row and 'consumer_value' in row and row['published_value'] != row['consumer_value']:
                errors.append(f'write_readback[{i}] consumer value differs from published value')
            if row.get('result_basis') != 'consumer-readback':
                errors.append(f'write_readback[{i}] must use consumer-readback, not a toast or DOM presence')
            if row.get('evidence_path'):
                try:
                    evidence_path = resolve(root, row['evidence_path'])
                    if row.get('evidence_sha256') != sha256(evidence_path):
                        errors.append(f'write_readback[{i}] evidence sha256 does not match original bytes')
                    evidence = json.loads(evidence_path.read_text(encoding='utf-8-sig'))
                    if type(evidence) is not dict:
                        errors.append(f'write_readback[{i}] evidence root must be an object')
                    else:
                        for key in ('target_id', 'published_value', 'consumer_value'):
                            if evidence.get(key) != row.get(key):
                                errors.append(f'write_readback[{i}] evidence {key} differs from declared value')
                except (ValueError, OSError, json.JSONDecodeError) as exc:
                    errors.append(f'write_readback[{i}] evidence: {exc}')
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path)
    parser.add_argument('--root', type=Path, required=True, help='Declared project root for relative artifact paths')
    args = parser.parse_args()
    data = json.loads(args.manifest.read_text(encoding='utf-8-sig'))
    errors = validate(data, args.root.resolve())
    if errors:
        print(json.dumps({'valid': False, 'errors': errors}, ensure_ascii=False, indent=2))
        raise SystemExit(1)
    print(json.dumps({'valid': True, 'meaning': 'declared evidence fields and file hashes are internally consistent; claims and browser behavior remain unverified'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
