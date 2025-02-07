import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager';

export const COMM_DELAY = 100

export type T_SVCC = {
    type: string,
    synno: number,
    cmd: string,
    param?: string,
}

function resolveSVCC(svccStr: string): T_SVCC | null {
    const regSVCC = /^!svCBM\|v1\|(ack|syn)(\d+)\|(.*?)(\|(.*))?\|/
    const regSVCCGroups = regSVCC.exec(svccStr)
    if (!regSVCCGroups) {
        return null
    }

    console.log(svccStr)

    return {
        type: regSVCCGroups[1],
        synno: Number.parseInt(regSVCCGroups[2]),
        cmd: regSVCCGroups[3],
        param: regSVCCGroups[5]
    }
}

var synno = 0

function sendSyn(cmd: string, param?: any) {
    var svccStr = '!svCBM|v1|syn' + synno + '|' + cmd + '|'
    if (param !== undefined) {
        svccStr += JSON.stringify(param) + '|'
    }
    return writeText(svccStr)
}

export function acceptAck(receivedSynno: number) {
    synno = receivedSynno
}

const _waitForReplyLoop = async (
    resolve: (value: string | void) => void,
    reject: (reason?: any) => void,
) => {
    const commtxt = await readText()
    do {
        if (commtxt.slice(0, 10) !== '!svCBM|v1|')  { break; }
        
        const svcc = resolveSVCC(commtxt)
        if (!svcc)                  { break; }
        if (svcc.type !== 'ack')    { break; }
        
        if (svcc.synno != synno + 1) {
            reject(`syn${synno} not-match on ack${svcc.synno}`);
            break;
        }

        acceptAck(svcc.synno)
        if (svcc.cmd === 'ok' || svcc.cmd === 'sync-ok') {
            resolve(svcc.param)
        } else if (svcc.cmd === 'error') {
            reject(svcc.param)
        } else {
            reject(`unknown-cmd: ${svcc.cmd}`)
        }

        return ;

    } while (false);
    setTimeout(() => {_waitForReplyLoop (resolve, reject)}, COMM_DELAY);
}

const waitForReply = () => new Promise<void | string>(_waitForReplyLoop)

export function defineSVCCCommand<T>(cmd: string): (param?: any) => Promise<string | void>
export function defineSVCCCommand<T>(cmd: string, then: (result: string | void) => Promise<T> | T): (param?: any) => Promise<T>
export function defineSVCCCommand<T>(cmd: string, then?: (result: string | void) => Promise<T> | T) {
    return async (param?: any) => {
        await sendSyn(cmd, param)
        const result = await waitForReply()
        if (then) {
            return await then(result)
        }
        return result
    }
}