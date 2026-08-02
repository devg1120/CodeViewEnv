export interface RepositoryRequest {
    data : {
        name: string;
        sha: string;
        size: number;
        type: "dir" | "file";
        path: string;
        url: string;
        children?: RepositoryRequest[];
    }[]
}

export interface Content {
    name: string;
    sha: string;
    size: number;
    type: "dir" | "file";
    path: string;
    url: string;
    isOpened: boolean;
    children?: Content[];
}

export interface ContentRequest {
    data: {
        content: string;
        type: "dir" | "file";
        size: number;
        url: string;
        sha: string;
        path: string;
        download_url: string;
        encoding: string;
        git_url: string;
        html_url: string;
        name: string;
    }
}