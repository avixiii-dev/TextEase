using Microsoft.UI;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using Microsoft.UI.Windowing;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Windows.Graphics;
using Windows.Storage;
using Windows.Storage.Pickers;
using Windows.Storage.Provider;
using WinRT.Interop;

namespace TextEase
{
    public sealed partial class MainWindow : Window
    {
        private bool _isTextChangedEnabled = true;
        private bool _isDocumentDirty = false;
        private string? _currentFilePath;
        private DispatcherTimer? _autoSaveTimer;
        private int _currentSearchPosition = -1;
        private const int AUTO_SAVE_INTERVAL = 30;  // seconds

        public MainWindow()
        {
            this.InitializeComponent();
            InitializeAutoSave();
            
            // Set initial window size
            var windowHandle = WindowNative.GetWindowHandle(this);
            var windowId = Microsoft.UI.Win32Interop.GetWindowIdFromWindow(windowHandle);
            var appWindow = AppWindow.GetFromWindowId(windowId);
            appWindow.Resize(new SizeInt32 { Width = 1024, Height = 768 });
        }

        private void InitializeAutoSave()
        {
            _autoSaveTimer = new DispatcherTimer();
            _autoSaveTimer.Interval = TimeSpan.FromSeconds(AUTO_SAVE_INTERVAL);
            _autoSaveTimer.Tick += AutoSave_Tick;
            _autoSaveTimer.Start();
        }

        private async void AutoSave_Tick(object? sender, object e)
        {
            if (!string.IsNullOrEmpty(_currentFilePath))
            {
                await File.WriteAllTextAsync(_currentFilePath, MainEditor.Text);
                StatusText.Text = "Auto-saved";
            }
        }

        private void MainEditor_TextChanged(object sender, TextChangedEventArgs e)
        {
            if (_isTextChangedEnabled)
            {
                _isDocumentDirty = true;
                StatusText.Text = "Modified";
            }
        }

        private async void NewFile_Click(object sender, RoutedEventArgs e)
        {
            if (_isDocumentDirty)
            {
                var dialog = new ContentDialog
                {
                    Title = "Save Changes?",
                    Content = "Do you want to save changes to the current file?",
                    PrimaryButtonText = "Save",
                    SecondaryButtonText = "Don't Save",
                    CloseButtonText = "Cancel",
                    XamlRoot = this.Content.XamlRoot
                };

                var result = await dialog.ShowAsync();
                if (result == ContentDialogResult.Primary)
                {
                    await SaveFile();
                }
                else if (result == ContentDialogResult.None)
                {
                    return;
                }
            }

            MainEditor.Text = string.Empty;
            _currentFilePath = null;
            _isDocumentDirty = false;
            StatusText.Text = "New Document";
        }

        private async void OpenFile_Click(object sender, RoutedEventArgs e)
        {
            await OpenFile();
        }

        private async void SaveFile_Click(object sender, RoutedEventArgs e)
        {
            await SaveFile();
        }

        private async void SaveAsFile_Click(object sender, RoutedEventArgs e)
        {
            var savePicker = new FileSavePicker();
            var hwnd = WindowNative.GetWindowHandle(this);
            InitializeWithWindow.Initialize(savePicker, hwnd);

            savePicker.SuggestedStartLocation = PickerLocationId.DocumentsLibrary;
            savePicker.FileTypeChoices.Add("Text Documents", new List<string>() { ".txt" });
            savePicker.SuggestedFileName = "New Document";

            var file = await savePicker.PickSaveFileAsync();
            if (file != null)
            {
                await SaveFile(file.Path);
            }
        }

        private void Exit_Click(object sender, RoutedEventArgs e)
        {
            Application.Current.Exit();
        }

        private void ShowFindReplace_Click(object sender, RoutedEventArgs e)
        {
            if (!FindReplacePanel.IsOpen)
            {
                FindReplacePanel.IsOpen = true;
                FindBox.Focus(FocusState.Programmatic);
                
                // If text is selected, use it as the search term
                if (MainEditor.SelectionLength > 0)
                {
                    FindBox.Text = MainEditor.SelectedText;
                }
            }
        }

        private void CloseFindReplace_Click(TeachingTip sender, object args)
        {
            // Clear the search fields
            FindBox.Text = string.Empty;
            ReplaceBox.Text = string.Empty;
            
            // Reset search position
            _currentSearchPosition = -1;
            
            // Close the panel
            FindReplacePanel.IsOpen = false;
            
            // Focus back to editor
            MainEditor.Focus(FocusState.Programmatic);
        }

        private void FindBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            // Reset search position when search text changes
            _currentSearchPosition = -1;
        }

        private void FindNext_Click(object sender, RoutedEventArgs e)
        {
            FindNextText();
        }

        private void FindNext_Invoked(KeyboardAccelerator sender, KeyboardAcceleratorInvokedEventArgs args)
        {
            FindNextText();
            args.Handled = true;
        }

        private void FindNextText()
        {
            if (string.IsNullOrEmpty(FindBox.Text)) return;

            var text = MainEditor.Text ?? string.Empty;
            var searchText = FindBox.Text;
            var startPosition = _currentSearchPosition + 1;
            
            // If we're at the end of the document, wrap around
            if (startPosition >= text.Length)
            {
                startPosition = 0;
            }
            
            // Find next occurrence
            var index = text.IndexOf(searchText, startPosition, StringComparison.OrdinalIgnoreCase);
            
            // If not found from current position, try from start
            if (index == -1 && startPosition > 0)
            {
                index = text.IndexOf(searchText, 0, StringComparison.OrdinalIgnoreCase);
            }

            if (index != -1)
            {
                // Select the found text
                MainEditor.SelectionStart = index;
                MainEditor.SelectionLength = searchText.Length;
                _currentSearchPosition = index;
                
                // Scroll to selection
                MainEditor.Focus(FocusState.Programmatic);
                StatusText.Text = $"Found at position {index + 1}";
            }
            else
            {
                StatusText.Text = "Text not found";
            }
        }

        private void Replace_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrEmpty(FindBox.Text)) return;

            var selectedText = MainEditor.SelectedText;
            if (selectedText.Equals(FindBox.Text, StringComparison.OrdinalIgnoreCase))
            {
                var replaceText = ReplaceBox.Text ?? "";
                
                // Store current position
                var currentPosition = MainEditor.SelectionStart;
                
                // Replace text
                MainEditor.SelectedText = replaceText;
                
                // Update search position to end of replaced text
                _currentSearchPosition = currentPosition + replaceText.Length - 1;
                
                // Find next occurrence
                FindNext_Click(sender, e);
                
                StatusText.Text = "Replaced and searching for next";
            }
            else
            {
                // If current selection is not the search text, find next occurrence
                FindNext_Click(sender, e);
            }
        }

        private void ReplaceAll_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrEmpty(FindBox.Text)) return;

            var text = MainEditor.Text;
            var searchText = FindBox.Text;
            var replaceText = ReplaceBox.Text ?? "";

            // Use Regex.Replace to handle case-insensitive replacement
            var newText = Regex.Replace(
                text,
                Regex.Escape(searchText),
                replaceText.Replace("$", "$$"), // Escape $ in replacement text
                RegexOptions.IgnoreCase
            );
            
            if (text != newText)
            {
                MainEditor.Text = newText;
                _currentSearchPosition = -1; // Reset search position
                _isDocumentDirty = true;
                StatusText.Text = "All occurrences replaced";
            }
            else
            {
                StatusText.Text = "No matches found";
            }
        }

        private async Task SaveFile(string? path = null)
        {
            if (path != null)
            {
                _currentFilePath = path;
            }

            if (string.IsNullOrEmpty(_currentFilePath))
            {
                var savePicker = new FileSavePicker();
                var hwnd = WindowNative.GetWindowHandle(this);
                InitializeWithWindow.Initialize(savePicker, hwnd);

                savePicker.SuggestedStartLocation = PickerLocationId.DocumentsLibrary;
                savePicker.FileTypeChoices.Add("Text Documents", new List<string>() { ".txt" });
                savePicker.SuggestedFileName = "New Document";

                var file = await savePicker.PickSaveFileAsync();
                if (file != null)
                {
                    _currentFilePath = file.Path;
                    CachedFileManager.DeferUpdates(file);
                    await FileIO.WriteTextAsync(file, MainEditor.Text);
                    await CachedFileManager.CompleteUpdatesAsync(file);
                }
            }
            else
            {
                await File.WriteAllTextAsync(_currentFilePath, MainEditor.Text);
            }

            _isDocumentDirty = false;
            StatusText.Text = "Saved";
        }

        private async Task OpenFile()
        {
            var openPicker = new FileOpenPicker();
            var hwnd = WindowNative.GetWindowHandle(this);
            InitializeWithWindow.Initialize(openPicker, hwnd);

            openPicker.ViewMode = PickerViewMode.List;
            openPicker.SuggestedStartLocation = PickerLocationId.DocumentsLibrary;
            openPicker.FileTypeFilter.Add(".txt");

            var file = await openPicker.PickSingleFileAsync();
            if (file != null)
            {
                _currentFilePath = file.Path;
                var text = await FileIO.ReadTextAsync(file);
                MainEditor.Text = text;
                _isDocumentDirty = false;
                StatusText.Text = "File opened";
            }
        }
    }
}
