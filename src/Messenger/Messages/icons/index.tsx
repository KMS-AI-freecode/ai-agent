import React from 'react'

export const SendArrowIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M3.5 10H16.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 4.5L16.5 10L11 15.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle
      cx="10"
      cy="10"
      r="8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeOpacity="0.3"
    />
    <path
      d="M10 2C14.4183 2 18 5.58172 18 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        from="0 10 10"
        to="360 10 10"
        dur="1s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
)
