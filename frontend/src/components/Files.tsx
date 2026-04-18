import { useEffect, useState } from "react";
import { fetchFiles } from "../services/api";
import type { FileData } from "../types";
import Card from "./Card";

type TreeNode = {
  name: string;
  files: FileData[];
  folders: Record<string, TreeNode>;
};

function buildTree(files: FileData[]): TreeNode {
  const root: TreeNode = { name: "root", files: [], folders: {} };

  files.forEach((file) => {
    // Handle both / and \ slashes
    const parts = file.path.split(/[/\\]/);
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.folders[part]) {
        current.folders[part] = { name: part, files: [], folders: {} };
      }
      current = current.folders[part];
    }
    
    current.files.push(file);
  });

  return root;
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className="folder-icon" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem', color: 'var(--text-muted)' }}>
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
      <polyline points="13 2 13 9 20 9"></polyline>
    </svg>
  );
}

function FolderNode({ node, defaultOpen = true }: { node: TreeNode, defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  const folderKeys = Object.keys(node.folders).sort();
  const sortedFiles = [...node.files].sort((a, b) => a.path.localeCompare(b.path));

  // If node is essentially empty (root usually), auto open.
  if (node.name === "root") {
    return (
      <div className="tree-node">
        {folderKeys.map((key) => (
          <FolderNode key={key} node={node.folders[key]} defaultOpen={true} />
        ))}
        {sortedFiles.map((file) => (
          <FileNode key={file.path} file={file} />
        ))}
      </div>
    );
  }

  return (
    <div className="tree-node">
      <div className="folder-header" onClick={() => setOpen(!open)}>
        <FolderIcon open={open} />
        <span style={{ fontWeight: 600 }}>{node.name}</span>
      </div>
      {open && (
        <div className="tree-children">
          {folderKeys.map((key) => (
            <FolderNode key={key} node={node.folders[key]} defaultOpen={false} />
          ))}
          {sortedFiles.map((file) => (
            <FileNode key={file.path} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileNode({ file }: { file: FileData }) {
  const fileName = file.path.split(/[/\\]/).pop() || file.path;
  
  return (
    <div className="file-row file-item" style={{ padding: '0.75rem', margin: '0.25rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
        <div className="file-path" style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
          <FileIcon />
          <span>{fileName}</span>
        </div>
        {file.importance && <span className="badge">Rank: {file.importance}</span>}
      </div>
      <p className="file-purpose" style={{ fontSize: '0.85rem' }}>{file.purpose}</p>
    </div>
  );
}

export default function Files() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles()
      .then(setFiles)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <Card title="Repository Explorer">
        <div style={{ color: '#ef4444' }}>Error: {error}</div>
      </Card>
    );
  }

  const fileTree = buildTree(files);

  return (
    <Card title={`Repository Explorer (${files.length})`}>
        {!Array.isArray(files) || files.length === 0 ? (
          <div className="thinking" style={{ padding: '2rem', textAlign: 'center' }}>Loading file explorer...</div>
        ) : (
          <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
             <FolderNode node={fileTree} defaultOpen={true} />
          </div>
        )}
    </Card>
  );
}
