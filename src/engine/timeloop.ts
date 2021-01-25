import World from "./world.js";


export interface Actor {
	act(world: World): Promise<number>;
}

interface Record {
	actor: Actor;
	remaining: number;
}

export default class TimeLoop {
	private queue: Record[] = [];

	private next() {
		let first = this.queue.shift() as Record;
		this.queue.forEach(record => record.remaining -= first.remaining);
		return first.actor;
	}

	add(actor: Actor, remaining=0) {
		let record = {actor, remaining};
		let index = 0;
		while (index < this.queue.length && this.queue[index].remaining <= remaining) {
		  index++;
		}
		this.queue.splice(index, 0, record);
	  }

	remove(actor: Actor) {
		let index = this.queue.findIndex(record => record.actor == actor);
		if (index == -1) { throw new Error("Cannot find actor to be removed"); }
		this.queue.splice(index, 1);
	}

	async start<T extends World>(world: T) {
		while (1) {
			let actor = this.next();
			let duration = await actor.act(world);
			this.add(actor, duration);
		}
	}
}
