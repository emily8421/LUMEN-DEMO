// 本地挂载目录树纯函数（E4 拆分溯源：useLocalVaultMount.ts 拆分——树构建）。
import type { LocalVaultDoc } from './local-vault-index';

/** 目录树节点（由扁平 docs 路径聚合，PoC renderTree 同构）。 */
export interface LocalMountTreeNode {
  name: string;
  path: string;
  children: Map<string, LocalMountTreeNode>;
  files: { name: string; doc: LocalVaultDoc }[];
}

/** 由 docs 路径聚合目录树（自动排除隐藏目录文件，已在 walk 阶段过滤）。 */
export function buildLocalMountTree(docs: LocalVaultDoc[]): LocalMountTreeNode {
  const root: LocalMountTreeNode = { name: '', path: '', children: new Map(), files: [] };
  for (const doc of docs) {
    const parts = doc.path.split('/');
    let node = root;
    let dirPath = '';
    for (let i = 0; i < parts.length - 1; i += 1) {
      const key = parts[i];
      dirPath = dirPath ? `${dirPath}/${key}` : key;
      let child = node.children.get(key);
      if (!child) {
        child = { name: key, path: dirPath, children: new Map(), files: [] };
        node.children.set(key, child);
      }
      node = child;
    }
    node.files.push({ name: parts[parts.length - 1], doc });
  }
  return root;
}
