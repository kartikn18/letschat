export type User = {
    id: number,
    username: string,
    password: string,
    created_at: Date
    email:string,
    is_verified:boolean
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
    is_public:boolean,
    description :string,
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
export type ProfileAvtar ={
    id:number,
    email:string,
    avatar_url:string,
    created_at:Date
    updated_at:Date
}
export type emailOtp = {
    id:number,
    email:string,
    otp:string,
    expires_at:Date,
    created_at:Date
}

export interface Database {
    users: User,
    rooms: Room,
    messages: Message
    room_members:RoomMember,
    room_sessions:RoomSession
    profile_avatars:ProfileAvtar,
    email_otps:emailOtp
}
