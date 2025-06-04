/**
 * Netlify Build Plugin: Rebuild Native Dependencies
 * 
 * This plugin ensures native dependencies like bcrypt are properly rebuilt
 * for the Netlify Linux environment during deployment.
 * 
 * Following PosalPro's platform engineering best practices and quality-first approach.
 */
module.exports = {
  onPreBuild: async ({ utils }) => {
    try {
      console.log('🔧 Rebuilding native dependencies for Netlify environment...');
      
      // Rebuild bcrypt specifically for the target platform
      await utils.run.command('npm rebuild bcrypt --build-from-source');
      
      console.log('✅ Successfully rebuilt native dependencies for deployment platform');
    } catch (error) {
      // Report detailed error information for troubleshooting
      utils.build.failPlugin(`Failed to rebuild native dependencies: ${error.message}`);
    }
  }
};
