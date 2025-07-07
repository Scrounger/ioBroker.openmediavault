export interface Disk {
	devicename: string
	canonicaldevicefile: string
	devicefile: string
	devicelinks: string[]
	model: string
	size: string
	description: string
	vendor: string
	serialnumber: string
	wwn: string
	israid: boolean
	isroot: boolean
	isreadonly: boolean
	powermode: string
	temperature: number
	hotpluggable: boolean
}
