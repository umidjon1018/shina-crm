// Login sahifasi belgisi (loginIconMode = 'bag'): 50 kg qog'oz qopni qadoqlash mashinasi klapan orqali kukun bilan to'ldiradi.
// Qop yassi holatdan to'lib bo'rtadi, to'lgach so'nadi va sikl qaytadi (5 s). Shakl o'zgarishi — SVG <animate>, qolgani — CSS.
const FLAT = 'M12 17 Q25 17 38 17 Q38 31 38 45 Q25 45 12 45 Q12 31 12 17 Z'
const FULL = 'M12 17 Q25 20.5 38 17 Q43 31 38 45 Q25 41.5 12 45 Q7 31 12 17 Z'
const SEAM_FLAT = 'M14.5 21 Q25 21 35.5 21'
const SEAM_FULL = 'M14.5 21.2 Q25 24.2 35.5 21.2'

const CSS = `
.sk-all { animation: sk-all 5s linear infinite; }
.sk-fill { transform-box: fill-box; transform-origin: 50% 100%; animation: sk-fill 5s cubic-bezier(.3,.6,.4,1) infinite; }
.sk-dust { animation: sk-dust 5s linear infinite; }
.sk-puff { animation: sk-puff .7s ease-out infinite; }
.sk-label { animation: sk-label 5s ease-in-out infinite; }
@keyframes sk-all { 0%, 88% { opacity: 1 } 97%, 100% { opacity: 0 } }
@keyframes sk-fill { 0% { transform: scaleY(0) } 66%, 100% { transform: scaleY(1) } }
@keyframes sk-dust { 0%, 62% { opacity: 1 } 66%, 100% { opacity: 0 } }
@keyframes sk-puff { 0% { transform: translate(0, 0); opacity: .9 } 100% { transform: translate(-3px, -3px); opacity: 0 } }
@keyframes sk-label { 0%, 50% { opacity: .3 } 68%, 100% { opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .sk-all, .sk-fill, .sk-dust, .sk-puff, .sk-label { animation: none } }
`

const Morph = ({ from, to }) => (
  <animate attributeName="d" dur="5s" repeatCount="indefinite" calcMode="spline"
    keyTimes="0;0.66;0.9;1" keySplines=".3 .6 .4 1;0 0 1 1;0 0 1 1" values={`${from};${to};${to};${to}`} />
)

const LoginSackIcon = ({ className }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <style>{CSS}</style>
    <defs>
      <clipPath id="sk-clip"><path d={FLAT}><Morph from={FLAT} to={FULL} /></path></clipPath>
    </defs>
    <g className="sk-all">
      {/* Qadoqlash mashinasi: bunker va klapanga kirgan nayza */}
      <path d="M3 4 H13 L11 9 H5 Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M8 9 V14.5 H15.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <g className="sk-dust" fill="currentColor">
        <circle className="sk-puff" cx="13" cy="13" r=".9" />
        <circle className="sk-puff" cx="14.5" cy="12" r=".7" style={{ animationDelay: '-.25s' }} />
        <circle className="sk-puff" cx="12" cy="11.8" r=".6" style={{ animationDelay: '-.5s' }} />
      </g>
      <g clipPath="url(#sk-clip)">
        <rect className="sk-fill" x="6" y="16" width="38" height="30" fill="currentColor" opacity=".4" />
      </g>
      <path d={FLAT} stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"><Morph from={FLAT} to={FULL} /></path>
      <path d={SEAM_FLAT} stroke="currentColor" strokeWidth="1.4" strokeDasharray="1.4 1.4" strokeLinecap="round"><Morph from={SEAM_FLAT} to={SEAM_FULL} /></path>
      <text className="sk-label" x="25" y="35.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="7.5" fill="currentColor">50kg</text>
    </g>
  </svg>
)

export default LoginSackIcon
