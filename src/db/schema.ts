export type User ={
    id:number,
    username : string,
    craetedAt: Date
    password:string
}

export type Message ={
    id : number,
    room_id:number,
    user_id:number,
    message:string,
    createdAt:Date
}

export type Room={
    id : number,
    name:string,
    createdAt: Date
}

export interface Database {
    users:User,
    rooms:Room,
    messages:Message
}