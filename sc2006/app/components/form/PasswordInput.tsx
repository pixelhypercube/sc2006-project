import {useState} from "react";
import {FiEye, FiEyeOff} from "react-icons/fi";

interface PasswordInputProps {
    label?: string,
    value?: string,
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
    inputRef?: React.RefObject<HTMLInputElement>
}

const PasswordInput = (
    {
        label = "Password",
        value,
        onChange,
        inputRef
    } : PasswordInputProps
) =>  {
    const [showPassword, setShowPassword] = useState(false);

    const toggleVisibility = () => {
        setShowPassword((prevState)=>!prevState);
    }

    return (
        <div className="flex flex-col mb-4">
            <label className="text-xl text-left mb-2">{label}</label>
            <div className="relative w-full">
                <input
                    ref={inputRef}
                    type={showPassword ? "text" : "password"}
                    className="w-full border-gray-400 rounded-lg p-2 bg-surface shadow-xl focus:outline-none"
                    value={value}
                    onChange={onChange}
                />
                <button
                    type="button"
                    onClick={toggleVisibility}
                    className="w-full absolute float-end bg-secondary"
                    
                >{}</button>
            </div>
        </div>
    )
}

export default PasswordInput;