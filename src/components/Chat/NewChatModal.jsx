import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './Chat.css'; // Reutilizar estilos

export default function NewChatModal({ onClose, onSelectChat }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState([]);
    const [newNumber, setNewNumber] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (searchTerm.length < 3) {
            setCustomers([]);
            return;
        }

        const searchCustomers = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, phone')
                .eq('role', 'customer')
                .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
                .not('phone', 'is', null)
                .limit(10);
            
            if (error) console.error('Erro ao pesquisar clientes:', error);
            else setCustomers(data || []);
            setLoading(false);
        };

        const timeoutId = setTimeout(searchCustomers, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleSelectChat = async (customer) => {
        const cleanedPhone = customer.phone.replace(/\D/g, '');
        const chatId = `${cleanedPhone}@s.whatsapp.net`;
        
        // Garante que a conversa existe e está aberta
        await supabase.from('whatsapp_chats').upsert({ 
            id: chatId, 
            name: customer.full_name, 
            status: 'open' 
        });

        onSelectChat({ id: chatId, name: customer.full_name });
        onClose();
    };
    
    const handleStartWithNewNumber = async (e) => {
        e.preventDefault();
        const cleanedNumber = newNumber.replace(/\D/g, '');
        if (cleanedNumber.length < 10) {
            alert('Por favor, insira um número de telefone válido com DDD.');
            return;
        }
        const chatId = `${cleanedNumber}@s.whatsapp.net`;
        await supabase.from('whatsapp_chats').upsert({ id: chatId, name: newNumber, status: 'open' });
        onSelectChat({ id: chatId, name: newNumber });
        onClose();
    };


    return (
        <div className="cart-modal-overlay modal-overlay-centered" onClick={onClose}>
            <div className="cart-modal-content" style={{height: 'auto', maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
                <div className="cart-header">
                    <h2>Nova Conversa</h2>
                    <button onClick={onClose}>&times;</button>
                </div>
                <div className="cart-body">
                    <div className="form-group">
                        <label>Pesquisar cliente por nome ou telefone</label>
                        <input 
                            type="text" 
                            placeholder="Digite 3 ou mais caracteres..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading && <p>A pesquisar...</p>}
                    <div className="customer-search-results">
                        {customers.map(customer => (
                            <div key={customer.id} className="customer-search-item" onClick={() => handleSelectChat(customer)}>
                                <p><strong>{customer.full_name}</strong></p>
                                <p>{customer.phone}</p>
                            </div>
                        ))}
                    </div>

                    <hr style={{margin: '2rem 0'}} />

                    <form onSubmit={handleStartWithNewNumber}>
                        <div className="form-group">
                            <label>Ou inicie com um novo número</label>
                            <input 
                                type="text" 
                                placeholder="Ex: 5511999998888"
                                value={newNumber}
                                onChange={(e) => setNewNumber(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Iniciar Conversa</button>
                    </form>
                </div>
            </div>
        </div>
    );
}