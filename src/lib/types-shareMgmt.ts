export interface ShareMgmt {
	uuid: string
	name: string
	comment: string
	mntentref: string
	reldirpath: string
	privileges: Privileges
	_used: boolean
	device: string
	description: string
	mntent: Mntent
	snapshots: boolean
}

export interface Privileges {
	privilege: Privilege[]
}

export interface Privilege {
	type: string
	name: string
	perms: number
}

export interface Mntent {
	devicefile: string
	fsname: string
	dir: string
	type: string
	posixacl: boolean
}