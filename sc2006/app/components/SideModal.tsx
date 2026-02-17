interface SideModalProps {
    background?:string,
    imgUrl?:string,
    title?:string,
    description?:string
}

export default function SideModal({
    background = "",
    imgUrl = "",
    title = "Lorem Ipsum",
    description = "dolor sit amet",
} : SideModalProps) {
    return (
        <div className={`bg-surface flex p-5 rounded-xl shadow-xl mt-5 mb-5 justify-${imgUrl ? "around" : ""}`}>
            {/* LEFT */}
            {imgUrl ? 
                <div className="border-r-gray-400">
                    <img src={imgUrl}/>
                </div>
            : <></>}
            {/* RIGHT */}
            <div className="border-l-gray-40 text-left">
                <h1 className="text-3xl font-bold">{title}</h1>
                <p className="text-lg">{description}</p>
            </div>
        </div>
    )
}