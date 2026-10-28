"""Tiny pure-model fixtures for profile consumption, layer scope, and order contracts."""


def generate_tokens(profile):
    """Model generation by consuming a profile snapshot; not a CSS renderer."""
    tokens = profile['tokens']
    shell = profile['page_shell']
    modal = profile['modal_defaults']
    return {'spacing': tokens['spacing'], 'frame': shell['frame'],
            'business_layer_host': modal['business_host']}


def reorder_before(items, source_id, target_id):
    ids = [row['id'] for row in items]
    if len(ids) != len(set(ids)) or source_id not in ids or target_id not in ids:
        raise ValueError('order operation requires unique, existing stable IDs')
    result = list(items)
    source = next(row for row in result if row['id'] == source_id)
    result.remove(source)
    target_index = next(i for i, row in enumerate(result) if row['id'] == target_id)
    result.insert(target_index, source)
    return result


def layer_contract(scope):
    if scope == 'business':
        return {'host': 'business-container', 'position': 'absolute', 'blocks': 'business-container'}
    if scope == 'review-viewport':
        return {'host': 'document-viewport', 'position': 'fixed', 'blocks': 'review-shell'}
    raise ValueError('unknown layer scope')


def publish_and_read(config):
    published = {'order': list(config['order'])}
    consumer = {'order': list(published['order'])}
    return published, consumer
