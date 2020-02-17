import { Action } from './action'

export class State{

    constructor( name, actions, context ){
        this.from = name
        this.actions = {}
        
        if( actions ){
            let entries = Object.entries(actions)
            for( let [action, to] of entries ){
                this.addAction(action, to, context)
            }
        }
    }

    addAction( action, to, context ){
        if( Array.isArray(to) ){
            throw new Error(`Pollon: [state-machine:invalid] Ambiguous transition '${this.from}'' -> '${action}'`)
        }
        this.actions[action] = new Action(action, this.from, to || this.from, this, context)
    }

    isActionValid( {name: action} ){
        if( !this.actions[action] ){
            return false
        }
        return true
    }   
}