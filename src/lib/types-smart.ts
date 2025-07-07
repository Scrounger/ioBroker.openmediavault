export interface Smart {
	devicename: string
	canonicaldevicefile: string
	devicefile: string
	devicelinks: string[]
	model: string
	size: string
	temperature: number
	description: string
	vendor: string
	serialnumber: string
	wwn: string
	overallstatus: string
	uuid: string
	monitor: boolean

	// additional types from endpoint smartInfo
	devicemodel: string
	firmwareversion: string
	usercapacity: string
	modelfamily: string
	luwwndeviceid: string
	sectorsizes: string
	rotationrate: string
	formfactor: string
	deviceis: string
	ataversionis: string
	sataversionis: string
	localtimeis: string
	smartsupportis: string
	powercycles: number
	poweronhours: number
}