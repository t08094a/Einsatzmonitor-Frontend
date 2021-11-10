import GoogleTextToSpeech from "./GoogleTextToSpeech";
import tmp, {FileResult} from "tmp";
import fs from "fs";
import {spawn} from "child_process";
import {logger, store} from "../../common/common";
import path from "path";

class TextToSpeech {
    private static COMMAND_FFMPEG = "ffmpeg";
    private text: string;

    constructor(text: string) {
        this.text = text;
    }

    private convertToMp3(tmpFile: FileResult): Promise<FileResult> {
        return new Promise<FileResult>((resolve, reject) => {
            const tmpResult = tmp.fileSync();

            let convertArgs = [
                "-nostats",
                "-hide_banner",
                "-loglevel", "0",
                "-y",
                "-i", tmpFile.name,
                "-vn",
                "-ar", "44100",
                "-ac", "2",
                "-ab", "320k",
                "-f", "mp3",
                tmpResult.name
            ]

            let convertProcess = spawn(TextToSpeech.COMMAND_FFMPEG, convertArgs);

            convertProcess.stderr.setEncoding("utf8")
            convertProcess.stderr.on('data', function (data: any) {
                logger.error("TextToSpeech |", data);
            });

            convertProcess.on('close', function () {
                logger.info('TextToSpeech | Finished converting TTS result to MP3.');
                tmpFile.removeCallback();
                resolve(tmpResult);
            });
        })
    }

    private prependStartingSound(tmpFile: FileResult): Promise<FileResult> {
        return new Promise<FileResult>((resolve, reject) => {
            let alarmSoundPath = path.resolve(__dirname, "static/sounds/alarm_long.mp3");

            // Copy to temp file since ffmpeg can't open bundled resource files (asar package)
            let alarmSoundTempFile = tmp.fileSync();

            fs.copyFile(alarmSoundPath, alarmSoundTempFile.name, (err => {
                const tmpResult = tmp.fileSync()

                let concatArgs = [
                    "-nostats",
                    "-hide_banner",
                    "-y",
                    "-i", "concat:" + alarmSoundTempFile.name + "|" + tmpFile.name,
                    "-acodec", "copy",
                    "-f", "mp3",
                    tmpResult.name
                ]

                let concatProcess = spawn(TextToSpeech.COMMAND_FFMPEG, concatArgs);

                concatProcess.stderr.setEncoding("utf8")
                concatProcess.stderr.on('data', function (data: any) {
                    logger.debug("TextToSpeech |", data);
                });

                concatProcess.on('close', function () {
                    logger.info('TextToSpeech | Finished creating final TTS file.');
                    tmpFile.removeCallback();
                    alarmSoundTempFile.removeCallback();
                    resolve(tmpResult);
                });
            }));
        });
    }

    private playSound(tmpFile: FileResult): void {
        let audio = new Audio(tmpFile.name);
        audio.play()
            .finally(() => {
                logger.debug('TextToSpeech | Started to play the TTS file. Removing..');
                tmpFile.removeCallback();
            })
    }

    public run(): void {
        if (store.get("tts.engine") == "Google") {
            let googleTextToSpeech = new GoogleTextToSpeech();
            googleTextToSpeech.run(this.text)
                .then(result => {
                    const tmpSpeech = tmp.fileSync();
                    fs.writeFileSync(tmpSpeech.name, result, 'binary');

                    return this.convertToMp3(tmpSpeech);
                })
                .then(result => {
                    return this.prependStartingSound(result);
                })
                .then(result => {
                    this.playSound(result);
                })
                .catch(reason => logger.error("TextToSpeech |", reason))
        }
    }
}

export default TextToSpeech;
