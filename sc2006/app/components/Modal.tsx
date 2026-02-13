interface ModalProps {
    title?:string,
    subtitle?:string,
    body?:string,
    backgroundColor?:string,
    imgUrl?:string,
}

export default function Modal({
    title = "",
    subtitle = "",
    body = "",
    backgroundColor = "#242424ff",
    imgUrl = "",
} : ModalProps) {
    return (
        <div style={{backgroundColor}} className="w-full p-4 rounded-xl gap-10">
            <div className="w-full flex justify-center">
                <img 
                alt="modal-img" 
                src={imgUrl}
                className="w-25"
                />
            </div>
            <div className="text-center">
                <h1>{title}</h1>
                <h2>{subtitle}</h2>
            </div>
            <hr className="border[#444444]"/>
            <div className="p-4">
                <p>{body}</p>
            </div>
        </div>
    )
}