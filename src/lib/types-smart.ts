export interface Smart {
	devicename?: string
	canonicaldevicefile?: string
	devicefile?: string
	devicelinks?: string[]
	model?: string
	size?: string
	temperature?: number
	description?: string
	vendor?: string
	serialnumber?: string
	wwn?: string
	overallstatus?: string
	uuid?: string
	monitor?: boolean

	// additional types from endpoint smartInfo
	devicemodel?: string
	firmwareversion?: string
	usercapacity?: string
	modelfamily?: string
	luwwndeviceid?: string
	sectorsizes?: string
	rotationrate?: string
	formfactor?: string
	deviceis?: string
	ataversionis?: string
	sataversionis?: string
	localtimeis?: string
	smartsupportis?: string
	powercycles?: string
	poweronhours?: string

	// additional types from endpoint smartAttributes
	raw_read_error_rate?: number
	spin_up_time?: number
	start_stop_count?: number
	spin_retry_count?: number
	runtime_bad_block?: number
	end_to_end_error?: number
	total_lbas_written?: number
	total_lbas_read?: number
}