import {
	// eslint-disable-next-line no-unused-vars
	CompanionActionInfo,
	// eslint-disable-next-line no-unused-vars
	CompanionActionContext,
	// eslint-disable-next-line no-unused-vars
	CompanionFeedbackInfo,
	// eslint-disable-next-line no-unused-vars
	CompanionFeedbackContext,
	InstanceStatus,
} from '@companion-module/base'

/**
 * Perform type conversion on value
 * @param {number} value
 * @param {string} name
 * @param {CompanionActionInfo} evt
 * @param {CompanionActionContext} context
 * @returns {Promise<number | undefined>}
 * @since 2.3.0
 */

export const calcRelativeValue = async (value, name, evt, context) => {
	const control = this.controls.get(name)
	const min = Number.parseFloat(await context.parseVariablesInString(evt.options.min))
	const max = Number.parseFloat(await context.parseVariablesInString(evt.options.max))
	if (control == undefined || control.value == null) {
		await this.addControl(evt, context)
		this.log('warn', `Do not have existing value of ${name}, cannot perform action ${evt.actionId}:${evt.id}`)
		return undefined
	}
	value = Number(value) + Number(control.value)
	if (isNaN(value)) {
		this.log('warn', `Result value is a NaN, cannot perform action ${evt.actionId}:${evt.id}`)
		return undefined
	}
	if (!isNaN(min)) value = value < min ? min : value
	if (!isNaN(max)) value = value > max ? max : value
	return value
}

/**
 * Perform type conversion on value
 * @param {string | number} value
 * @param {'string' | 'boolean' | 'number'} type
 * @returns {string | number | boolean }
 * @since 2.3.0
 */

export const convertValueType = (value, type) => {
	switch (type) {
		case 'number':
			value = Number(value)
			if (Number.isNaN(value)) return undefined
			return value
		case 'boolean':
			if (value.toLowerCase().trim() == 'false' || value.trim() == '0') {
				return false
			} else if (value.toLowerCase().trim() == 'true' || value.trim() == '1') {
				return true
			} else {
				return Boolean(value)
			}
		case `string`:
		default:
			return String(value)
	}
}

/**
 * Remove illegal characters from variable Ids
 * @param {string} id variable id to sanitize
 * @param {'' | '.' | '-' | '_'} substitute Char to replace illegal characters
 * @since 2.3.0
 */

export const sanitiseVariableId = (id, substitute = '_') => id.replaceAll(/[^a-zA-Z0-9-_.]/gm, substitute)

/**
 * Build valid array of outputs
 * @param {CompanionActionInfo} evt
 * @param {CompanionActionContext} context
 * @returns {Promise<number[] | undefined>}
 * @since 2.3.0
 */
export const buildFilteredOutputArray = async (evt, context) => {
	let filteredOutputs = []
	const outputs = (await context.parseVariablesInString(evt.options.output))
		.split(',')
		.map((out) => Number.parseInt(out))
	outputs.forEach((out) => {
		if (!isNaN(out) && out > 0 && !filteredOutputs.includes(out)) filteredOutputs.push(out)
	})
	if (filteredOutputs.length == 0) {
		this.log('warn', `No valid outputs for ${evt.actionId}:${evt.id}`)
		return undefined
	}
	return filteredOutputs
}

/**
 * Return new moduleStatus object
 * @returns {object} new moduleStatus
 * @since 2.3.0
 */

export const resetModuleStatus = () => {
	return {
		status: InstanceStatus.Connecting,
		message: '',
		logLevel: 'debug',
		logMessage: '',
		primary: {
			status: InstanceStatus.Connecting,
			message: '',
			state: null,
			design_name: '',
			redundant: null,
			emulator: null,
			design_code: '',
		},
		secondary: {
			status: InstanceStatus.Connecting,
			message: '',
			state: null,
			design_name: '',
			redundant: null,
			emulator: null,
			design_code: '',
		},
	}
}

/**
 * Add message to outbound queue and send
 * @param {object} cmd Command object to send
 * @returns {boolean} If cmd.method is OK to send to core that isn't active
 */

export const validMethodsToStandbyCore = (cmd) => {
	const validMethods = ['StatusGet', 'NoOp', 'Logon'] //Add methods here that are OK to send to core that is in Standby or Idle
	return validMethods.includes(cmd?.method)
}
