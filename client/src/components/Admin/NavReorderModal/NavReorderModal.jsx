import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaArrowUp, FaArrowDown, FaSort } from 'react-icons/fa';
import './NavReorderModal.css';

const NavReorderModal = ({ isOpen, onClose, items, onSave }) => {
    const [orderedItems, setOrderedItems] = useState([]);
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);

    useEffect(() => {
        if (items) {
            setOrderedItems([...items]);
        }
    }, [items]);

    if (!isOpen) return null;

    const moveItem = (index, direction) => {
        const newItems = [...orderedItems];
        if (direction === 'up' && index > 0) {
            [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
        } else if (direction === 'down' && index < newItems.length - 1) {
            [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        }
        setOrderedItems(newItems);
    };

    const handleDragStart = (e, index) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Ghost image personalization if needed, or browser default
    };

    const handleDragOver = (e, index) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move";

        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const newItems = [...orderedItems];
        const draggedItem = newItems[draggedItemIndex];

        // Remove dragged item from old position
        newItems.splice(draggedItemIndex, 1);
        // Insert into new position
        newItems.splice(index, 0, draggedItem);

        setOrderedItems(newItems);
        setDraggedItemIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedItemIndex(null);
    };

    const handleSave = () => {
        onSave(orderedItems);
        onClose();
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="nav-reorder-modal-overlay" onMouseDown={handleOverlayClick}>
            <div className="nav-reorder-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="nav-reorder-modal-header">
                    <h2><FaSort /> Organizar Menu</h2>
                    <button className="nav-reorder-close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <ul className="nav-reorder-list">
                    {orderedItems.map((item, index) => (
                        <li
                            key={item.id}
                            className={`nav-reorder-item ${draggedItemIndex === index ? 'dragging' : ''}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                        >
                            <span className="nav-reorder-item-label">
                                <FaSort className="drag-handle" /> {item.icon} {item.label}
                            </span>
                            <div className="nav-reorder-controls">
                                <button
                                    className="nav-reorder-btn"
                                    onClick={() => moveItem(index, 'up')}
                                    disabled={index === 0}
                                    title="Mover para cima"
                                >
                                    <FaArrowUp size={12} />
                                </button>
                                <button
                                    className="nav-reorder-btn"
                                    onClick={() => moveItem(index, 'down')}
                                    disabled={index === orderedItems.length - 1}
                                    title="Mover para baixo"
                                >
                                    <FaArrowDown size={12} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>

                <div className="nav-reorder-actions">
                    <button className="nav-reorder-btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="nav-reorder-btn-save" onClick={handleSave}>
                        <FaSave /> Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NavReorderModal;
