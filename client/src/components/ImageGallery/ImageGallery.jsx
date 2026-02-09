import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './ImageGallery.css';

const ImageGallery = ({ images, alt = 'Gallery image' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    const goToNext = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
    };

    const goToImage = (index) => {
        setCurrentIndex(index);
    };

    // Keyboard navigation
    React.useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowLeft') goToPrevious();
            if (e.key === 'ArrowRight') goToNext();
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    if (!images || images.length === 0) {
        return null;
    }

    console.log('ImageGallery - Total images:', images.length, 'Current index:', currentIndex);
    console.log('Current image URL:', images[currentIndex]);

    return (
        <div className="image-gallery">
            <div className="gallery-main">
                <img
                    src={images[currentIndex]}
                    alt={`${alt} ${currentIndex + 1}`}
                    className="gallery-image"
                />

                {images.length > 1 && (
                    <>
                        <button
                            className="gallery-arrow gallery-arrow-left"
                            onClick={goToPrevious}
                            aria-label="Previous image"
                        >
                            <FaChevronLeft />
                        </button>
                        <button
                            className="gallery-arrow gallery-arrow-right"
                            onClick={goToNext}
                            aria-label="Next image"
                        >
                            <FaChevronRight />
                        </button>

                        <div className="gallery-counter">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </>
                )}
            </div>

            {images.length > 1 && (
                <div className="gallery-dots">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            className={`gallery-dot ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => goToImage(index)}
                            aria-label={`Go to image ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageGallery;
