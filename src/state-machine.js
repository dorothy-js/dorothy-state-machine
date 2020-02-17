import { Publisher, Subscriber, Broker as EventBroker } from '@pollon/message-broker'
import { State } from './state'

export class StateMachine{

    static get EVENTS(){
        return {
            LEFT: 'statemachine.state_leaving',
            ON: 'statemachine.state',
            ENTERED: 'statemachine.state_entered'
        }
    }

    constructor( options ){
        let transitions

        this.transitions = {}
        transitions = options.transitions || {}

        if( !transitions[options.initial] ){
            throw new Error(`Pollon: [state-machine:invalid] Invalid initial state '${options.initial}'`)
        }

        for( let [from, actions] of Object.entries(transitions) ){
            this.transitions[from] = new State(from, actions, this)
        }

        // normalize orphan end statuses;
        for( let [, actions] of Object.entries(transitions) ){
            for( let [, to] of Object.entries(actions) ){
                if( !this.transitions[to] ){
                    this.transitions[to] = new State(to, {}, this)
                }
            }
        }

        this.currentState = this.transitions[options.initial]
        this.pending = null
        this.Bus = new EventBroker()
        this.publisher = new Publisher(Object.values(StateMachine.EVENTS))
        this.Bus.addPublisher(this.publisher)
    }

    isPending(){
        return !!this.pending
    }

    can( action ){
        return !!this.currentState.actions[action]
    }

    on( event, state, handler, once ){
        let cfg, subscriber

        cfg = {}

        cfg[event] = {
            method: ( sender, args ) => {
                if( (state == args.state ) || ('*' == state) ){
                    return handler(sender, args)
                }
            },
            once: !!once
        }

        subscriber = new Subscriber(cfg)
        this.Bus.addSubscriber(subscriber)
        return subscriber
    }

    off( subscriber ){
        this.Bus.removeSubscriber(subscriber)
    }

    handle( action, ...args ){

        if( !this.can(action) ){
            return Promise.reject(`[State Machine] action '${action}'' forbidden in the current state '${this.currentState.from}'`)
        }

        return new Promise(( resolve, reject ) => {
            return this.currentState.actions[action].execute(...args)
                .then(function(){
                    resolve()
                })
                .catch(function( reason ){
                    reject(reason)
                })
        })
    }
}
