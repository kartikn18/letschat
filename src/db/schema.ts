export type User = {
    id: number,
    username: string,
    password: string,
    created_at: Date
}

export type Message = {
    id: number,
    room_id: number,
    user_id: number,
    content: string,
    created_at: Date,
    message_type: string
}

export type Room = {
    id: number,
    room_name: string,
    created_at: Date
    password:string
}

export type RoomMember= {
    id:number,
    room_id:number,
    user_id:number,
    joined_at:Date,
    last_seen_at:Date,
}

export type RoomSession = {
    id:number,
    room_id:number,
    user_id:number,
    socket_id:string,
    joined_at :Date,
    is_active:boolean,
}

export interface Database {
    users: User,
    rooms: Room,
    messages: Message
    room_members:RoomMember,
    room_sessions:RoomSession
}
