import Background from "engine/background.js";
import * as palette from "./palette.js";


export default class Water extends Background {
	query() {
		return {ch: 0, fg: 0, bg: palette.BLUE};
	}
}
