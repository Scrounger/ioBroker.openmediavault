export interface Smb {
    uuid: string
    enable: boolean
    sharedfolderref: string
    comment: string
    guest: string
    readonly: boolean
    browseable: boolean
    recyclebin: boolean
    recyclemaxsize: number
    recyclemaxage: number
    hidedotfiles: boolean
    inheritacls: boolean
    inheritpermissions: boolean
    easupport: boolean
    storedosattributes: boolean
    hostsallow: string
    hostsdeny: string
    audit: boolean
    timemachine: boolean
    transportencryption: boolean
    followsymlinks: boolean
    widelinks: boolean
    extraoptions: string
    sharedfoldername: string
}
