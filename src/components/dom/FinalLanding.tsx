'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface FinalLandingProps {
    showPrompt: boolean  // Phase 1: Show scroll prompt during projection
    showCard: boolean    // Phase 2: Show product card after scroll
}

export default function FinalLanding({ showPrompt, showCard }: FinalLandingProps) {
    return (
        <>
            {/* Phase 1: Scroll Prompt (appears during projection) */}
            <AnimatePresence>
                {showPrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <span className="text-white/40 text-xs tracking-[0.3em] uppercase font-mono">
                                SCROLL TO CONTINUE
                            </span>
                            <motion.div
                                animate={{ y: [0, 8, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className="w-[1px] h-10 bg-gradient-to-b from-[#00f3ff]/50 to-transparent"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Phase 2: Product Card (appears after scroll) */}
            <AnimatePresence>
                {showCard && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="fixed inset-0 z-[90] flex items-end pb-24 justify-start pl-12 md:pl-24 pointer-events-none"
                    >
                        {/* Glassmorphism Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="relative max-w-md pointer-events-auto"
                        >
                            {/* Gradient glow background */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#ff00ff]/30 via-[#8b5cf6]/20 to-[#00f3ff]/30 rounded-lg blur-xl opacity-70" />

                            {/* Glass card */}
                            <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg p-8 shadow-2xl">
                                {/* Top accent line - gradient */}
                                <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-[#ff00ff] via-[#8b5cf6] to-[#00f3ff]" />

                                {/* Header */}
                                <div className="mb-6">
                                    <span className="text-[#00f3ff] text-xs font-mono tracking-[0.3em] uppercase opacity-60">
                                        FLUID_DYNAMIC
                                    </span>
                                    <h2 className="text-white text-3xl md:text-4xl font-light tracking-wide mt-2">
                                        VR Headset
                                    </h2>
                                    <p className="text-white/40 text-sm mt-1 font-light tracking-wider">
                                        NEURAL_INTERFACE_v2.0
                                    </p>
                                </div>

                                {/* Description */}
                                <div className="mb-8 space-y-3">
                                    <p className="text-white/60 text-sm leading-relaxed font-light">
                                        Experience immersive virtual reality with our next-generation neural interface.
                                        Seamlessly blend consciousness with digital realms.
                                    </p>

                                    {/* Feature list */}
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-center gap-3 text-white/50">
                                            <span className="w-1 h-1 bg-[#00f3ff] rounded-full" />
                                            <span>360° Spatial Audio</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-white/50">
                                            <span className="w-1 h-1 bg-[#8b5cf6] rounded-full" />
                                            <span>Neural Haptic Feedback</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-white/50">
                                            <span className="w-1 h-1 bg-[#ff00ff] rounded-full" />
                                            <span>Holographic Display</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* CTA Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="relative w-full py-3 px-6 rounded overflow-hidden group"
                                >
                                    {/* Button gradient background */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff00ff]/20 via-[#8b5cf6]/20 to-[#00f3ff]/20 group-hover:from-[#ff00ff]/40 group-hover:via-[#8b5cf6]/40 group-hover:to-[#00f3ff]/40 transition-all duration-300" />
                                    <div className="absolute inset-0 border border-[#00f3ff]/30 rounded group-hover:border-[#00f3ff]/60 transition-all duration-300" />
                                    <span className="relative text-[#00f3ff] text-sm font-mono tracking-[0.2em] uppercase">
                                        EXPLORE NOW
                                    </span>
                                </motion.button>

                                {/* Bottom accent */}
                                <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
