import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

/** Browser tab icon — bunker hatch + amber hazard accent */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1c1917',
          borderRadius: 6,
          border: '1.5px solid #a16207',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'repeating-linear-gradient(-45deg, #fbbf24 0 3px, #1c1917 3px 6px)',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            marginTop: 2,
            borderRadius: 3,
            border: '1.5px solid #d97706',
            background: 'linear-gradient(160deg, #292524 0%, #0c0a09 100%)',
            color: '#fef3c7',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: -0.5,
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          }}
        >
          LS
        </div>
      </div>
    ),
    { ...size },
  )
}
