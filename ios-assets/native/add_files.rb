# adds Wakhan's own iOS files to the Xcode project and makes MainViewController the start screen
require 'xcodeproj'
proj = Xcodeproj::Project.open('ios/App/App.xcodeproj')
target = proj.targets.find { |t| t.name == 'App' }
group = proj.main_group.find_subpath('App', false)
%w[MainViewController.swift WakhanLocalePlugin.swift].each do |f|
  next if group.files.any? { |x| x.path == f }
  ref = group.new_reference(f)
  target.add_file_references([ref])
end
proj.save
sb = 'ios/App/App/Base.lproj/Main.storyboard'
s = File.read(sb)
s2 = s.gsub(/customClass="CAPBridgeViewController" customModule="Capacitor"/, 'customClass="MainViewController" customModule="App" customModuleProvider="target"')
raise 'storyboard: view controller not found' if s2 == s && !s.include?('MainViewController')
File.write(sb, s2)
puts 'iOS: Wakhan native files added'
