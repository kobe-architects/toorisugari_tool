import type { WeatherIconKind } from '@shared/types';

/**
 * 天気アイコン（SVG）。売上管理・日次の各日に表示する。
 * 種別は WeatherController の iconOf と対応。
 */
export function WeatherIcon({ kind, size = 20, title }: { kind: WeatherIconKind; size?: number; title?: string }) {
  const sun = '#e0a52e';
  const cloud = '#9aa4ad';
  const rain = '#4f86c6';
  const snow = '#7fb2d6';
  const bolt = '#e0a52e';

  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' } as const;

  const CloudPath = ({ color }: { color: string }) => (
    <path
      d="M7 18h9.5a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 7.2 12.2 3.4 3.4 0 0 0 7 18Z"
      fill={color}
    />
  );

  let body: React.ReactNode;
  switch (kind) {
    case 'sunny':
      body = (
        <>
          <circle cx="12" cy="12" r="4.4" fill={sun} />
          <g stroke={sun} strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 2.6v2.4M12 19v2.4M21.4 12H19M5 12H2.6M18.6 5.4l-1.7 1.7M7.1 16.9l-1.7 1.7M18.6 18.6l-1.7-1.7M7.1 7.1 5.4 5.4" />
          </g>
        </>
      );
      break;
    case 'partly':
      body = (
        <>
          <circle cx="8.5" cy="8" r="3.3" fill={sun} />
          <g stroke={sun} strokeWidth="1.5" strokeLinecap="round">
            <path d="M8.5 1.8v1.7M2.3 8H4M13 8h1.7M4.4 3.9l1.2 1.2M12.6 3.9l-1.2 1.2" />
          </g>
          <CloudPath color={cloud} />
        </>
      );
      break;
    case 'cloudy':
      body = <CloudPath color={cloud} />;
      break;
    case 'rain':
      body = (
        <>
          <CloudPath color={cloud} />
          <g stroke={rain} strokeWidth="1.9" strokeLinecap="round">
            <path d="M9 19.5l-1 2M13 19.5l-1 2M16.5 19.5l-1 2" />
          </g>
        </>
      );
      break;
    case 'snow':
      body = (
        <>
          <CloudPath color={cloud} />
          <g fill={snow}>
            <circle cx="9" cy="20.4" r="1.1" />
            <circle cx="13" cy="20.4" r="1.1" />
            <circle cx="16.5" cy="20.4" r="1.1" />
          </g>
        </>
      );
      break;
    case 'thunder':
      body = (
        <>
          <CloudPath color={cloud} />
          <path d="M12.5 18.4l-3 3.4h2.2l-.9 2.6 3.2-3.8h-2.3l.9-2.2Z" fill={bolt} />
        </>
      );
      break;
    default:
      body = <CloudPath color={cloud} />;
  }

  return (
    <svg {...common} role="img" aria-label={title}>
      {title && <title>{title}</title>}
      {body}
    </svg>
  );
}
