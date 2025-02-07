function getClientInfo() {
    return {
        "name" : "歌词编辑器后台服务",
        "author" : "凋零葉 (inspired by 河冰)",
        "versionNumber" : 1,
        "minEditorVersion" : 0
    };
}



function _CiGe_Separation(){
    this.arr = [];
    this.onSet = NaN;
    this.duration = NaN;
    this.push = function (note){
        if(isNaN(this.onSet)) {
            this.onSet = note.getOnset();
        }
        this.arr.push(note);
        this.duration = note.getOnset() + note.getDuration() - this.onSet;
    }
    this.getOnSet = function (){
        return this.onSet;
    }
    this.getDuration = function (){
        return this.duration;
    }
    this.getNumberOfNotes = function (){
        return this.arr.length;
    }
}

function _CiGe_SeparationManager() {
    this.separations = [];
    this.newSeparation = function (){
        return this.separations[this.separations.push(new _CiGe_Separation()) - 1];
    };
}

function getFirstNoteTrack(){
    var project = SV.getProject();
    if(project.getNumTracks() === 0){
        return null;
    }
    for(var i = 0; i < project.getNumTracks(); i++){
        if(! project.getTrack(i).getGroupReference(0).isInstrumental())
            return project.getTrack(i);
    }
    return null;
}

function fetchNotesSync() {
    var selection = SV.getMainEditor().getSelection();
    if(! selection.hasSelectedNotes()){
        var track = getFirstNoteTrack();
        if(track === null){
            SV.showMessageBoxAsync("任务失败", "工程内没有任何音符轨道", function (){})
            return null;
        }

        // TODO: 为 workflow 流畅，这里不再提示，以后可以改成持久化的选项，只在第一次获取时询问；可以选择任意一个 track
        // const status = SV.showOkCancelBox("提示", "没有选中音符，是否读取音轨 "+track.getName()+" 的所有音符？")
        // if(status){
        var groupReference = track.getGroupReference(0);

        var group = groupReference.getTarget();
        var notes = [];
        for (var i = 0; i < group.getNumNotes(); i++) {
            notes.push(group.getNote(i));
        }
        return notes;
        // }
    } else {
        var notes = selection.getSelectedNotes();
        return notes;
    }
}

function fetchLyric() {
    var notes = fetchNotesSync()
    if (!notes) {
        return null;
    }

    return notes.map(function (note) { return note.getLyrics() })
}

function fetchCige() {
    var notes = fetchNotesSync()
    if (!notes) {
        return null;
    }

    return processNotes(notes)
}

function processNotes(notes){
    var separationManager = new _CiGe_SeparationManager();
    var lastEnd = -1;
    var sep = null;
    var note;
    var quarterBased;
    var quaverNum = 0;      // 八分音符
    var crotchetNum = 0;    // 四分音符
    var minimNum = 0;       // 二分音符
    for (var i = 0; i < notes.length; i++) {
        note = notes[i];
        if(note.getOnset() > lastEnd){
            sep = separationManager.newSeparation()
        }
        sep.push(note);
        lastEnd = note.getOnset() + note.getDuration();

        quarterBased = SV.blick2Quarter(note.getDuration());
        if (Math.abs(quarterBased - 1) < 0.1){
            crotchetNum ++;
        }else if(Math.abs(quarterBased - 2) < 0.1){
            minimNum ++;
        }else if(Math.abs(quarterBased - 0.5) < 0.1){
            quaverNum ++;
        }
    }

    var baseSwitch;
    var maxLengthNum = Math.max(quaverNum, crotchetNum, minimNum);
    if(maxLengthNum === quaverNum){
        baseSwitch = 0;
    }else if(maxLengthNum === crotchetNum){
        baseSwitch = 1;
    }else{
        baseSwitch = 2;
    }

    var result = null;
    do{
        baseSwitch = (result === null) ? baseSwitch : result.answers.base;
        var str = generateResult(separationManager, baseSwitch);

        var resultForm = {
            title: "执行结果",
            message: "从 " + notes.length + " 个音符中，共检测 " + separationManager.separations.length + " 个分割。" + "\n"
                   + "八分音符 " + quaverNum + " 个，四分音符 " + crotchetNum + " 个，二分音符 " + minimNum + " 个。",
            buttons: "YesNoCancel",
            widgets: [
                {
                    name : "base",   type : "ComboBox",
                    label : "分句基准",
                    choices : ["八分音符", "四分音符", "二分音符"],
                    default : baseSwitch
                },
                {
                    name : "result", type : "TextArea",
                    label : "提取内容",
                    height : 200,
                    default : str
                }
            ]
        }
        result = SV.showCustomDialog(resultForm);
    } while(result.status == "No");

    if (result.status == "Yes") {
        return result.answers.result
    } else {
        return null
    }
}

function generateResult(separationManager, baseSwitch) {
    var baseSentence = SV.QUARTER * 8 * Math.pow(2, baseSwitch - 1);     // 八小节定律
    var str = "";
    var maru = "〇";

    var lastSentenceHead = NaN;
    var lastSegmentHead = NaN;
    for (var i = 0; i < separationManager.separations.length; i++) {
        var sep = separationManager.separations[i];

        if (isNaN(lastSentenceHead)) {
            lastSentenceHead = sep.getOnSet();
            if (isNaN(lastSegmentHead)) {
                lastSegmentHead = sep.getOnSet();
            }
        }

        if(sep.getOnSet() + sep.getDuration() - lastSegmentHead >= 8 * baseSentence){
            str = str + "\n";
            lastSegmentHead = sep.getOnSet();
            str = str + "\n";
            lastSentenceHead = sep.getOnSet();
        }else if(sep.getOnSet() - lastSentenceHead >= baseSentence){
            str = str + "\n";
            lastSentenceHead = sep.getOnSet();
        }

        for (var j = 0; j < sep.getNumberOfNotes(); j++) {
            str = str + maru;
        }

        str = str + "　";
    }
    return str;
}

/**
 * 
 * @param {string[]} lyrics 
 */
function setLyric(lyrics) {
    var notes = fetchNotesSync()
    if (!notes) {
        return null;
    }
    for (var i = 0; i < notes.length; i++) {
        notes[i].setLyrics(lyrics[i])
    }
}

function position(index) {
    var notes = fetchNotesSync()
    if (!notes) {
        return null;
    }

    const startTime = SV.getProject().getTimeAxis().getSecondsFromBlick(
        notes[index].getOnset()
    ) - 0.1

    SV.getPlayback().seek(startTime)
}

/** 
 * @typedef {Object} T_SVCC
 * @property {string} type
 * @property {number} synno
 * @property {string} cmd
 * @property {string} [param]
 */


/**
 * 
 * @param {string} svccStr 
 * @returns {T_SVCC}
 */
function resolveSVCC(svccStr) {
    const regSVCC = /^!svCBM\|v1\|(ack|syn)(\d+)\|(.*?)(\|(.*))?\|/
    const regSVCCGroups = regSVCC.exec(svccStr)
    if (!regSVCCGroups) {
        return null
    }

    return {
        type: regSVCCGroups[1],
        synno: Number.parseInt(regSVCCGroups[2]),
        cmd: regSVCCGroups[3],
        param: regSVCCGroups[5]
    }
}

var synno = 0

/**
 * 
 * @param {string} cmd 
 * @param {string} [param]
 */
function replyAck(cmd, param) {
    var svccStr = '!svCBM|v1|ack' + synno + '|' + cmd + '|'
    if (param) {
        svccStr += param + '|'
    }
    SV.setHostClipboard(svccStr)
}

/**
 * 
 * @param {number} receivedSynno 
 */
function acceptSyn(receivedSynno) {
    synno = receivedSynno + 1
}

const cmds = {
    play() {
        SV.getPlayback().play()
    },

    pause() {
        SV.getPlayback().pause()
    },

    stop() {
        SV.getPlayback().stop()
    },

    fetchCige,
    fetchLyric,
    setLyric,
    position,
}

const COMM_DELAY = 100

function retrieveCommunication() {
    const commtxt = SV.getHostClipboard()
    do {
        if (commtxt.slice(0, 10) === '!svCBM|v1|') {
            const svcc = resolveSVCC(commtxt)
            if (!svcc)                  { break; }
            if (svcc.type !== 'syn')    { break; }

            if (svcc.cmd === 'sync') {
                acceptSyn(svcc.synno)
                replyAck('sync-ok')
                break;
            }

            if (svcc.synno != synno) {
                replyAck('not-match')
                break;
            }

            acceptSyn(svcc.synno)
            if (!(svcc.cmd in cmds)) {
                replyAck('not-supported')
                break;
            }

            const result = cmds[svcc.cmd](svcc.param && JSON.parse(svcc.param))
            const returnVal = result ? JSON.stringify(result) : undefined
            replyAck('ok', returnVal)

        }
    } while (false);
    SV.setTimeout(COMM_DELAY, retrieveCommunication);
}

function main() {
    SV.setTimeout(COMM_DELAY, retrieveCommunication);
}

/*

!svCBM|v1|syn0|play
!svCBM|v1|ack1|ok
!svCBM|v1|syn1|pause
!svCBM|v1|ack2|ok
// here, user restart browser
!svCBM|v1|syn0|play
!svCBM|v1|ack2|not-match   // if ack not match, browser remind user
// if user insist to resync, start sync
!svCBM|v1|syn0|sync
!svCBM|v1|ack1|sync-ok
!svCBM|v1|syn1|fetchLyric
!svCBM|v1|ack2|error|no-selection
!svCBM|v1|ack2|ok|{"data": "一 闪 一 闪 亮 晶 晶 满 天 都 是 小 星 星"}
!svCBM|v1|syn2|fetchCige
!svCBM|v1|ack3|ok|{"data": "〇〇〇〇〇〇〇\n〇〇〇〇〇〇〇"}
!svCBM|v1|syn3|updateCige|{"data": "〇〇〇〇 〇〇〇\n〇〇〇〇 〇〇〇"}
!svCBM|v1|ack4|ok
*/

/* v2 多终端？
!svCBM|v2|syn0|ad553c95-16b8-4d76-84d7-8f1e0da71471|hello
!svCBM|v2|ack1|ad553c95-16b8-4d76-84d7-8f1e0da71471|ok
!svCBM|v2|syn0|efd664bd-71ff-47f3-b2ef-90860126a529|hello
!svCBM|v2|ack1|efd664bd-71ff-47f3-b2ef-90860126a529|comm-occupied
!svCBM|v2|syn0|efd664bd-71ff-47f3-b2ef-90860126a529|!hello
!svCBM|v2|ack1|efd664bd-71ff-47f3-b2ef-90860126a529|hello
*/





