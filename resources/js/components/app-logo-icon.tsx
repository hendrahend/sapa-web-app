import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 6.5C6.067 6.5 4.5 8.067 4.5 10v15c0 1.933 1.567 3.5 3.5 3.5h5.5l4 5 4-5H32c1.933 0 3.5-1.567 3.5-3.5V10c0-1.933-1.567-3.5-3.5-3.5H8Zm6.06 8.96 3.97 3.97 7.91-7.91 2.12 2.13-10.03 10.03-6.09-6.09 2.12-2.13Z"
            />
        </svg>
    );
}
