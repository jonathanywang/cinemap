import React from 'react';

interface LogoProps {
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
    return (
        <svg 
            width="60" 
            height="40" 
            viewBox="0 0 180 110" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path d="M180 50.023L133.846 0.0363273L127.354 8.39169L165.815 50.023H14.2155L52.677 8.35536L46.1847 0L0.0308312 50.023H0V82.9727C0 97.867 12.1535 110 27.0769 110H55.5388C70.4615 110 82.6157 97.867 82.6157 82.9727V61.3209H97.3843V82.9727C97.3843 97.867 109.538 110 124.462 110H152.923C167.846 110 180 97.867 180 82.9727V50.023Z" fill="currentColor"/>
            <mask id="mask0_0_1" maskUnits="userSpaceOnUse" x="119" y="56" width="43" height="49">
                <path d="M161.264 56.6922V103.745H119.881V56.6922H161.264Z" fill="white" stroke="white"/>
            </mask>
            <g mask="url(#mask0_0_1)">
                <path d="M153.817 80.2185L140.572 95.2348" stroke="black" strokeWidth="4.375" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M151.168 63.7004L126.003 92.2316" stroke="black" strokeWidth="4.375" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            <mask id="mask1_0_1" maskUnits="userSpaceOnUse" x="18" y="56" width="43" height="49">
                <path d="M18.767 56.6922V103.745H60.1498V56.6922H18.767Z" fill="white" stroke="white"/>
            </mask>
            <g mask="url(#mask1_0_1)">
                <path d="M26.2137 80.2185L39.4584 95.2348" fill="#7C1313"/>
                <path d="M26.2137 80.2185L39.4584 95.2348" stroke="black" strokeWidth="4.375" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M28.8626 63.7004L54.0275 92.2316" fill="#7C1313"/>
                <path d="M28.8626 63.7004L54.0275 92.2316" stroke="black" strokeWidth="4.375" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
        </svg>
    );
};

export default Logo;