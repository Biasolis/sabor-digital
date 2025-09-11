import React, { useEffect, useState } from 'react';

const Notification = ({ message, type, onClose }) => {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
            // Espera a animação de saída terminar antes de remover o componente
            setTimeout(onClose, 500); 
        }, 4500); // Inicia a animação de saída 500ms antes de fechar

        return () => clearTimeout(timer);
    }, [onClose]);

    const handleClose = () => {
        setExiting(true);
        setTimeout(onClose, 500);
    };

    return (
        <div className={`notification notification-${type} ${exiting ? 'exit' : ''}`}>
            <div className="notification-message">{message}</div>
            <button onClick={handleClose} className="notification-close-btn">&times;</button>
        </div>
    );
};

export default Notification;