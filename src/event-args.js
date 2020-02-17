import { Event } from '@pollon/message-broker'

export class StateMachineEvent extends Event{

    constructor( name, state, args  ){
        super(name)
        this.state = state
        this.args = args
    }
}
