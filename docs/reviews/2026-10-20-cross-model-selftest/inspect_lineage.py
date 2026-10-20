"""Read-only V2.2/V3.0 lineage evidence. Does not execute attached instructions.

Run: python -X utf8 docs/reviews/2026-10-20-cross-model-selftest/inspect_lineage.py
Source anchors are exact text matches; classification remains editorial analysis.
"""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE.parent/'2026-10-20-steam'))
from inspect_sources import assigned_json

PATHS = {
    'v22': Path(r'D:\模型汇总\CDK商城\AI原型图与组件级文档说明标准_V2.2.md'),
    'v30': Path(r'D:\模型汇总\CDK商城\AI原型图与组件级文档说明标准_V3.0.md'),
    'final': Path(r'D:\模型汇总\CDK商城\Steam商城原型交付_V1.0\02_低保真交互原型-最终版本.html'),
    'trial2': Path(r'D:\模型汇总\GitHub维护测试\试跑2.0\Steam商城原型交付_V1.4\02_低保真交互原型-试跑2.0.html'),
}

# Each anchor establishes wording/location, not enforcement or causal origin.
RULES = [
    ('R01','灰度与禁止视觉包装','禁止自行改成高保真品牌网站','| 设计系统/视觉规范 |','explicit_prohibition_weakened'),
    ('R02','语义色与本次纯灰度选择','| 成功 / 提醒 / 错误 |','| `--error` |','both_allow_semantic_colors_new_user_decision_requires_alignment'),
    ('R03','搜索历史','| 搜索历史 |','- 搜索历史：本人提交词','retained_not_a_new_feature'),
    ('R04','结果页不重复排序','**不在结果页重复提供排序组件**','- 结果页不重复提供排序组件','retained'),
    ('R05','默认搜索不回填','**从结果页返回搜索默认页时输入框为空','- 搜索默认页输入框默认空','retained'),
    ('R06','扫码弹窗三态与支付选择','| 扫码支付弹窗 |','- 支付方式在上一页选定','retained_and_expanded'),
    ('R07','当前端内跳转','| 跨端跳转 |','- 页面编号按当前端取','retained'),
    ('R08','退出与现场','| 返回与关闭 |','- 关闭弹层返回详情，保留选择现场','retained_but_nested_contract_still_needs_detail'),
    ('R09','操作有实际结果','真实控件应可输入、可选择','- 禁止只改提示、不改数据的空动作','retained'),
    ('R10','迟到回调隔离','9. **异步与上下文：**','- 回调只处理版本一致的请求','retained_and_expanded'),
    ('R11','详情读取被点击ID','| 详情与点击对象一致 |','- 详情按订单号读取','retained'),
    ('R12','查询草稿与提交','1. **草稿与已提交条件分开：**','- **草稿与已提交分离**','retained'),
    ('R13','派生计数同源','- **派生计数同源。**','### 3.7 计数口径','retained'),
    ('R14','查看与写入','| 查看详情 |','| 查看类 | 不写数据','read_only_explicit_in_v30'),
    ('R15','阅读历史与上下文','- 在阅读器中切换文档时','### 19.4 切换、历史与定位','retained'),
    ('R16','组件十节与语义','**完成检查：** 01全部注册组件均有十节正文','### 22.2 十节固定顺序','retained'),
    ('R17','实测与证据边界','结论仅使用通过、失败、未验证、不适用','任何一层不能替代另一层','retained_and_expanded'),
    ('R18','预设不替代主流程','预设切换用于直接查看状态，不能代替实际操作主流程','| 业务操作 | 执行真实模拟提交','retained'),
    ('R19','菜单选中态','**不使用浅色反白块压在深色底上**','| 后台菜单 |','v30_internal_conflict_with_12_2'),
    ('R20','外壳几何默认值','| 内容容器 |','| 移动客户端 | 最大宽 1440px','default_changed_not_proof_of_regression'),
    ('R21','主列表列数','字段确实较多时，优先扩大原型区域','3. 主列控制在 **7 列以内**','new_hard_numeric_constraint'),
    ('R22','可逆动作确认范围','停用、下架、冻结等**可逆**动作','- 上架/下架、启用/停用、冻结/解冻','confirmation_scope_expanded'),
    ('R23','实现命名与行为','类名可按实现调整','- 所有可点击动作通过统一的 `data-act` 分发','implementation_contract_tightened'),
    ('R24','图源示例一致性','```mermaid','### I.5 PlantUML 流程片源','v22_example_conflict_v30_example_corrected'),
    ('R25','版本标注残留','请依据《AI原型图与组件级文档说明标准 V2.1》','### 34.2 从 V2.2 迁移','v22_prompt_stale_version'),
    ('R26','状态按钮换行策略','| 状态与筛选按钮 |','- 状态/筛选按钮为可换行矩形','general_vs_profile_ambiguity_in_both'),
    ('R27','离线依赖与合法外链','其他资源和外部链接有明确打开方式','| 外链资源 | `src/href` 无 `http(s)` |','v30_scan_rule_needs_dependency_scope'),
]


def hit(source, needle):
    at = source.find(needle)
    if at < 0:
        raise ValueError('Missing source anchor: '+needle)
    line = source.count('\n',0,at)+1
    return {'line':line,'quote':source.splitlines()[line-1]}


def main():
    sources = {key:p.read_text(encoding='utf-8-sig') for key,p in PATHS.items()}
    manifest = json.loads((ROOT/'standard-manifest.json').read_text(encoding='utf-8'))
    data = {
        'date':'2026-10-20', 'method':'read_only_text_and_embedded_document_analysis',
        'browser_executed':False, 'cross_model_generation_experiment_executed':False,
        'user_reported_lineage':[
            'V2.2 was produced using GPT',
            'The accepted final prototype evolved from an initial prototype under V2.2 through human revisions',
            'V3.0 was produced by DeepSeek from V2.2 and the final prototype',
        ],
        'lineage_limit':'Human-reported history; original generation transcripts and exact initial-input snapshots were not independently verified. Embedded V2.1 labels are preserved as metadata discrepancies, not used to override the user account.',
        'sources':{k:{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':len(p.read_bytes()),'lines':len(sources[k].splitlines())} for k,p in PATHS.items()},
        'active_baseline':{'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'rule_version':manifest['rule_version'],'content_revision':manifest['content_revision'],'manifest_sha256':hashlib.sha256((ROOT/'standard-manifest.json').read_bytes()).hexdigest()},
        'rule_comparison':[],
    }
    for rid,title,v22,v30,kind in RULES:
        data['rule_comparison'].append({'id':rid,'topic':title,'v22':hit(sources['v22'],v22),'v30':hit(sources['v30'],v30),'classification':kind})
    docs = assigned_json(sources['final'],'DOCS')
    delivery = next(d for d in docs if d['file'].startswith('00_'))
    data['final_embedded_version_labels']=[{'file':delivery['file'],'line':i,'quote':l} for i,l in enumerate(delivery['md'].splitlines(),1) if ('交付标准' in l or ('CHG-0060' in l and 'V2.2' in l))]
    data['conflict_anchors']={
        'v30_menu_detail':hit(sources['v30'],'当前项唯一高亮（整行＋左侧标线＋白字）'),
        'v30_client_tabs':hit(sources['v30'],'- 取值集合在目标画布宽度内完整可见'),
        'v22_client_tabs':hit(sources['v22'],'| 状态与筛选按钮组 |'),
        'v22_diagram_rule':hit(sources['v22'],'不使用Mermaid，也不使用自研的图源解析器'),
        'v22_change_scope':hit(sources['v22'],'本轮**不含**管理后台相关规则'),
        'v30_minimum_browser_gate':hit(sources['v30'],'- 至少一条详情/编辑路径按正确记录打开'),
    }
    assert data['sources']['v30']['sha256']==manifest['baseline']['sha256']
    assert data['sources']['v22']['lines']==1423
    (HERE/'evidence.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'source_hashes':{k:v['sha256'] for k,v in data['sources'].items()},'rule_comparisons':len(RULES),'browser_executed':False,'model_experiments_executed':False},ensure_ascii=False))


if __name__=='__main__':
    main()
