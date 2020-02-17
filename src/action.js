import { StateMachine } from './state-machine'
import { StateMachineEvent } from './event-args'

let fire = function( context, event, state, args ){
    return () => {
        let ctx = context
        if( args && args.length > 1 ){
            ctx = args.pop()
        }
        return context.publisher.fire(event, new StateMachineEvent(event, state, args), ctx)
    }
}

export class Action{

    constructor( name, from, to, state, context ){
        this.name = name
        this.from = from
        this.to = to
        this.state = state
        this.context = context
    }

    isActionValid(){
        return this.state.isActionValid(this)
    }

    execute( ...args ){
        if( !this.isActionValid() ){
            throw `[State Machine] Invalid action '${this.name}' called on state: '${this.state.from}'`
        }

        if( this.context.isPending() ){
            throw `[State Machine] pending transition '${this.context.currentState.from}'`
        }

        this.context.pending = true

        return Promise.resolve(this)
            .then(fire(this.context, StateMachine.EVENTS.LEFT, this.state.from))
            .then(fire(this.context, StateMachine.EVENTS.ON, this.name, args))
            .then(() => {
                let endAction

                endAction = this.context.currentState.actions[this.name]
                this.context.currentState = this.context.transitions[endAction.to]
            })
            .then(fire(this.context, StateMachine.EVENTS.ENTERED, this.to, args))
            .then(() => {
                this.context.pending = false
            })
    }

}
