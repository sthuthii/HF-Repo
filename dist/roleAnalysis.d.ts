import "dotenv/config";
import { type RoleView, type MultiRoleView, type RepositoryOverview, type DataFlowResult, type FileDetails } from "./index";
/**
 * Initialize the role analysis system with files from the database
 */
export declare function initializeRoleAnalysis(): Promise<void>;
/**
 * Get role-specific analysis for a given role
 */
export declare function getRoleAnalysis(roleName: string): Promise<RoleView>;
/**
 * Get multi-role comparison analysis
 */
export declare function getMultiRoleAnalysis(roleNames: string[]): Promise<MultiRoleView>;
/**
 * Trace data flow for a specific file
 */
export declare function traceDataFlow(filePath: string): Promise<DataFlowResult>;
/**
 * Get detailed file information for a specific role
 */
export declare function getFileRoleDetails(filePath: string, roleName: string): Promise<FileDetails>;
/**
 * Get repository overview for a role
 */
export declare function getRepositoryOverview(roleName: string): Promise<RepositoryOverview>;
/**
 * Pretty print role view analysis
 */
export declare function printRoleView(view: RoleView): void;
/**
 * Pretty print repository overview
 */
export declare function printRepositoryOverview(overview: RepositoryOverview): void;
/**
 * Pretty print file details
 */
export declare function printFileDetails(details: FileDetails): void;
/**
 * Pretty print data flow
 */
export declare function printDataFlow(flow: DataFlowResult): void;
//# sourceMappingURL=roleAnalysis.d.ts.map