interface ModalProps {
    title?:string,
    subtitle?:string,
    body?:string,
    background?:string,
    imgUrl?:string,
    inverseImg?:boolean,
}

export default function Modal({
    title = "",
    subtitle = "",
    body = "",
    background = "bg-surface", // also accepts bg class
    imgUrl = "",
    inverseImg = false
} : ModalProps) {
    const isBgClass = background.startsWith("bg-");

    return (
        <div 
        style={{backgroundColor: !isBgClass ? background : undefined}} 
        className={`w-full p-4 rounded-3xl shadow-xl ${background}`}>
            <div className="w-full flex justify-center">
            {
                imgUrl ?
                <img 
                alt="modal-img" 
                src={imgUrl}
                className="w-25"
                style={{filter:inverseImg ? "invert()" : ""}}
                />
                : <></>
            }
            </div>
            <div className="text-center">
                <h1 className="text-3xl font-semibold mt-5 mb-5">{title}</h1>
                <h2 className="text-xl">{subtitle}</h2>
            </div>
            <hr className="border[#444444]"/>
            <div className="p-4">
                <p>{body}</p>
            </div>
        </div>
    )
}