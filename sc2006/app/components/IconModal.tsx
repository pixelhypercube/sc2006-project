interface ModalProps {
    title?:string,
    subtitle?:string,
    body?:string
}

export default function Modal({
    title = "",
    subtitle = "",
    body = ""
} : ModalProps) {
    return (
        <div className="w-full p-2">
            <h1>{title}</h1>
            <h2>{subtitle}</h2>
            <hr/>
            <p>{body}</p>
        </div>
    )
}