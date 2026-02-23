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
        <div className={`bg-surface flex p-10 rounded-xl shadow-xl mt-5 mb-5 justify-${imgUrl ? "around" : ""}`}>
            {/* LEFT */}
            {imgUrl ? 
                <div className="border-r-gray-400 mr-5">
                    <img style={{maxWidth:"100px"}} src={imgUrl}/>
                </div>
            : <></>}
            {/* RIGHT */}
            <div className="border-l-gray-40 text-left ml-5 flex flex-col justify-center">
                <h1 className="text-3xl font-bold">{title}</h1>
                <p className="text-lg">{description}</p>
            </div>
        </div>
    )
}