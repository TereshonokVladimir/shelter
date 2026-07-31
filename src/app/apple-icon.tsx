import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/** Home-screen / pinned-tab icon */
export default function AppleIcon() {
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
          borderRadius: 36,
          border: '6px solid #a16207',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 18,
            background: 'repeating-linear-gradient(-45deg, #fbbf24 0 10px, #1c1917 10px 20px)',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 96,
            height: 96,
            marginTop: 8,
            borderRadius: 16,
            border: '5px solid #d97706',
            background: 'linear-gradient(160deg, #292524 0%, #0c0a09 100%)',
            color: '#fef3c7',
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: -2,
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
