export interface HostInfo {
    server: string;
    user: string;
    _serialized: string;
}

export interface HostUsed {
    hostname: string;
    ips: Array<object>;
    type: string;
    class: string;
    downloadBuckets: Array<number>;
    '$1': object;
    '$2': object;
    fallback: HostUsed | null;
    selectedBucket: number;
}

export interface HostDeviceInfo {
    id: HostInfo;
    displayName: string | null;
    verifiedName: string | null;
    searchName: string | null;
    pushname: string | null;
    notifyName: string | null;
    isBusiness: boolean | null;
    formattedUser: string | null;
    tag: string;
    eurl: string;
    previewEurl: string;
    fullDirectPath: string;
    previewDirectPath: string;
    filehash: string;
    stale: boolean;
    eurlStale: boolean;
    timestamp: number;
    hostRetryCount: number;
    lastHostUsed: HostUsed;
}
