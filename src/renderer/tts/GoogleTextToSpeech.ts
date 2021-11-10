import axios from "axios";
import {store} from "../../common/common";

class GoogleTextToSpeech {
    private readonly ttsUrl?: string;
    private readonly apiKey?: string;

    constructor() {
        this.apiKey = store.get("google.ttsApikey") as string;
        if (this.apiKey)
            this.ttsUrl = `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${this.apiKey}`;
    }

    run(text: string): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            if (!this.ttsUrl) {
                reject("No Google TTS API-Key provided.");
                return;
            }

            axios.post(this.ttsUrl, {
                "input": {
                    "text": text
                },
                "voice": {
                    "languageCode": "de-DE",
                    "name": "de-DE-Wavenet-B",
                    "ssmlGender": "MALE"
                },
                "audioConfig": {
                    "audioEncoding": "OGG_OPUS",
                    "speakingRate": 0.90
                }
            })
                .then(response => {
                    return resolve(Buffer.from(response.data["audioContent"], 'base64'));
                })
                .catch(reason => reject(reason))
        })
    }
}

export default GoogleTextToSpeech;
