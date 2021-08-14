class Time {
    hour: number;
    minute: number;

    isBiggerThan = (other: Time) => {
        return (this.hour > other.hour) || (this.hour === other.hour) && (this.minute > other.minute);
    };

    constructor(timeString: string) {
        this.hour = Number.parseInt(timeString.split(":")[0]);
        this.minute = Number.parseInt(timeString.split(":")[1]);
    }
}

export default Time;