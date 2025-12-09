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
    created_at: Date
}

export type Room = {
    id: number,
    room_name: string,
    created_at: Date
    password:string
}

export interface Database {
    users: User,
    rooms: Room,
    messages: Message
}