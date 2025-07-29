import { isEmpty, isNil } from 'ramda';

/**
 * Junção de `isNil` e `isEmpty` do Ramda em uma função
 *
 * - Returns `true` if the given value is its type's empty value; `false`
 * otherwise.
 *
 * - Checks if the input value is `null` or `undefined`.
 *
 * @example
 * ```typescript
 * isNull(null);                //=> true
 * isNull(undefined);           //=> true
 * isNull(0);                   //=> false
 * isNull([1, 2, 3]);           //=> false
 * isNull([]);                  //=> true
 * isNull('');                  //=> true
 * isNull('    ');              //=> true
 * isNull({});                  //=> true
 * isNull({length: 0});         //=> false
 * isNull(Uint8Array.from('')); //=> true
 * ```
 */
export function isNull(valueCheck: string | any, trimCheck: boolean = true): boolean {
	if (isNil(valueCheck)) return true;
	if (isEmpty(valueCheck)) return true;
	if (trimCheck && typeof valueCheck == 'string' && isEmpty((valueCheck as string).trim()))
		return true;

	return false;
}

/**
 * Inverso da função isNull
 */
export function isNotNull(valueCheck): boolean {
	return !isNull(valueCheck);
}
